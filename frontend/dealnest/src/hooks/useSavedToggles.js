import { useCallback, useEffect, useRef, useState } from 'react';
import { favoriteService, savedPromotionService } from '../services/api';

// Favouriting a store (the heart) and saving a deal (the bookmark) were both
// add-only. Every call site opened with "is this already saved?" and returned early,
// so a filled heart did nothing when tapped, the bookmark could not be cleared, and
// the only way out was the trash icon on My Favorites. These two hooks own the
// saved-state for both lists, so every screen that draws a heart or a bookmark agrees
// on the answer and can toggle it either way.
//
// Removal is keyed by the saved row's own id — both delete endpoints take that row,
// not a (user, item) pair — so the state is a map of item id -> saved row id rather
// than the bare Set of item ids the pages used to hold.

const favoriteStoreIdOf = (row) => row?.store?.storeId;
const savedPromotionIdOf = (row) => row?.promotion?.promotionID;

const indexRows = (rows, itemIdOf, rowKey) => {
  const index = {};
  rows.forEach(row => {
    const itemId = itemIdOf(row);
    if (itemId != null) index[itemId] = row[rowKey];
  });
  return index;
};

function useSavedItems({ userId, itemIdOf, rowKey, load, create, remove }) {
  const [rowIds, setRowIds] = useState({});
  const rowIdsRef = useRef(rowIds);
  rowIdsRef.current = rowIds;

  // In-flight items, read inside the toggle callback so its identity does not have to
  // change on every keystroke elsewhere on the page. Doubling up on one item would
  // send the add twice and leave a duplicate row behind, because neither table has a
  // uniqueness constraint on (user, item).
  const inFlight = useRef(new Set());

  // Bumped on every reload so a response that arrives after a newer reload started —
  // or after the user changed — cannot overwrite the fresher state.
  const generation = useRef(0);

  const reload = useCallback(() => {
    const gen = ++generation.current;
    if (!userId) {
      setRowIds({});
      return Promise.resolve();
    }
    return load(userId)
      .then(rows => {
        if (gen !== generation.current) return;
        setRowIds(indexRows(Array.isArray(rows) ? rows : [], itemIdOf, rowKey));
      })
      .catch(() => {});
  }, [userId, load, itemIdOf, rowKey]);

  useEffect(() => {
    reload();
    const gen = generation;
    return () => {
      // Discard whatever the previous user / previous mount left in flight.
      gen.current++;
    };
  }, [reload]);

  const isSaved = useCallback((itemId) => rowIds[itemId] !== undefined, [rowIds]);

  const toggle = useCallback(async (itemId) => {
    if (!userId || inFlight.current.has(itemId)) return;

    const rowId = rowIdsRef.current[itemId];
    const wasSaved = rowId != null;

    inFlight.current.add(itemId);
    setRowIds(prev => {
      const next = { ...prev };
      // Optimistic: the icon flips on the tap rather than after the round trip. The
      // placeholder stands in for a row id that does not exist yet, so the entry
      // reads as saved until the create hands back the real one.
      if (wasSaved) delete next[itemId];
      else next[itemId] = null;
      return next;
    });

    try {
      if (wasSaved) {
        const removed = await remove(rowId);
        // A non-ok response means the row is still there (or never was), so the local
        // answer is unproven. Re-read the truth rather than leave the heart lying.
        if (removed === false) return reload();
      } else {
        const created = await create(userId, itemId);
        const createdId = created?.[rowKey];
        // Nothing usable came back, so there is no id to delete this by later.
        if (createdId == null) return reload();
        setRowIds(prev => ({ ...prev, [itemId]: createdId }));
      }
    } catch (error) {
      setRowIds(prev => {
        const next = { ...prev };
        if (wasSaved) next[itemId] = rowId;
        else delete next[itemId];
        return next;
      });
      throw error;
    } finally {
      inFlight.current.delete(itemId);
    }
  }, [userId, create, remove, reload, rowKey]);

  return { isSaved, toggle };
}

// The heart on a store card / store page.
export function useFavorites(user) {
  const { isSaved, toggle } = useSavedItems({
    userId: user?.userID,
    itemIdOf: favoriteStoreIdOf,
    rowKey: 'favoriteStoreID',
    load: favoriteService.getByUser,
    create: favoriteService.add,
    remove: favoriteService.remove,
  });
  return { isFavorite: isSaved, toggleFavorite: toggle };
}

// The bookmark on a deal card / store page.
export function useSavedDeals(user) {
  const { isSaved, toggle } = useSavedItems({
    userId: user?.userID,
    itemIdOf: savedPromotionIdOf,
    rowKey: 'savedPromotionID',
    load: savedPromotionService.getByUser,
    create: savedPromotionService.add,
    remove: savedPromotionService.remove,
  });
  return { isDealSaved: isSaved, toggleSavedDeal: toggle };
}

// A 402 off savedPromotion/create is the free plan's saved-deal cap rather than a
// fault, and it is the one failure a user can actually act on.
export const isSaveLimitError = (error) =>
  error?.status === 402 || /dealnest plus/i.test(error?.message || '');