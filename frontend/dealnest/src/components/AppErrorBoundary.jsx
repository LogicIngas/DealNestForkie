import React from 'react'

/**
 * Last thing standing between a render error and a blank screen.
 *
 * React has no built-in error boundary: an exception thrown while rendering unmounts the
 * whole tree and leaves an empty page behind. That is silent by design — no console banner,
 * no fallback UI, nothing on screen to say a thing went wrong or which thing.
 *
 * That has now cost this app twice. Both times the cause was a malformed route table, which
 * React Router reports by throwing an invariant from inside <Routes>:
 *
 *   "Suspense is not a <Route> component. All component children of <Routes> must be a
 *    <Route> or <React.Fragment>"
 *
 * (the first was the /app/app prefix loop in 3403a70, the second a <Suspense> placed inside
 * <Routes> instead of around it). Both presented as "the page is blank", which says nothing
 * about the cause and costs a bisect to find.
 *
 * So: catch it, show what actually threw, and make the console the same information. A
 * broken page should look broken and be diagnosable, not white.
 */
class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // The rendered message below already carries `error`, but the component stack is the
    // part that says *where*, and it is only available here.
    console.error('DealNest crashed while rendering:', error, info?.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8 max-w-xl w-full">
          <h1 className="text-lg font-extrabold text-gray-800">This page hit an error</h1>
          <p className="text-sm text-gray-500 mt-2 mb-4">
            The app stopped rather than leaving you on a blank screen. Reloading usually
            clears it; if it keeps happening, the details below are what to report.
          </p>

          {/* The thrown message verbatim. React Router's route-table invariants are
              specific enough to identify the mistake from, which is the whole point —
              a generic "something went wrong" would have meant bisecting again. */}
          <pre className="bg-gray-900 text-gray-100 rounded-2xl p-4 text-xs overflow-auto max-h-48 whitespace-pre-wrap">
            {String(this.state.error?.message || this.state.error)}
          </pre>

          <div className="flex gap-3 mt-5">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-full bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition"
            >
              Reload
            </button>
            <button
              type="button"
              onClick={() => window.location.assign('/')}
              className="px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold transition"
            >
              Back to home
            </button>
          </div>
        </div>
      </div>
    )
  }
}

export default AppErrorBoundary
