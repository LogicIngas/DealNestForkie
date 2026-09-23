package za.ac.cput.dealnest;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class DealnestApplication {

    public static void main(String[] args) {
        SpringApplication.run(DealnestApplication.class, args);
    }

}
