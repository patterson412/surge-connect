package com.surge.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.provisioning.JdbcUserDetailsManager;
import org.springframework.security.provisioning.UserDetailsManager;

import javax.sql.DataSource;

@Configuration
public class UserDetailsConfig {

    @Bean
    public UserDetailsManager userDetailsManager(DataSource dataSource) {
        JdbcUserDetailsManager jdbcUserDetailsManager = new JdbcUserDetailsManager(dataSource);

        jdbcUserDetailsManager.setUsersByUsernameQuery(
                "select user_id, pw, active from members where user_id=?"
        );

        jdbcUserDetailsManager.setAuthoritiesByUsernameQuery(
                "select user_id, role from roles where user_id=?"
        );

        // Create/Update/Delete queries
        jdbcUserDetailsManager.setCreateUserSql(
                "insert into members (user_id, pw, active) values (?,?,?)"
        );
        jdbcUserDetailsManager.setCreateAuthoritySql(
                "insert into roles (user_id, role) values (?,?)"
        );
        jdbcUserDetailsManager.setDeleteUserSql(
                "delete from members where user_id = ?"
        );
        jdbcUserDetailsManager.setDeleteUserAuthoritiesSql(
                "delete from roles where user_id = ?"
        );
        jdbcUserDetailsManager.setUpdateUserSql(
                "update members set pw = ?, active = ? where user_id = ?"
        );

        return jdbcUserDetailsManager;
    }
}

