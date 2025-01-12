package com.surge.backend.util;

import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Component
public class TimeFormatter {

    public String toRelativeTime(LocalDateTime dateTime) {
        if (dateTime == null) {
            return "";
        }

        LocalDateTime now = LocalDateTime.now();

        long years = ChronoUnit.YEARS.between(dateTime, now);
        if (years > 0) return years + "y";

        long months = ChronoUnit.MONTHS.between(dateTime, now);
        if (months > 0) return months + "m";

        long weeks = ChronoUnit.WEEKS.between(dateTime, now);
        if (weeks > 0) return weeks + "w";

        long days = ChronoUnit.DAYS.between(dateTime, now);
        if (days > 0) return days + "d";

        long hours = ChronoUnit.HOURS.between(dateTime, now);
        if (hours > 0) return hours + "h";

        long minutes = ChronoUnit.MINUTES.between(dateTime, now);
        if (minutes > 0) return minutes + "m";

        return "just now";
    }
}
