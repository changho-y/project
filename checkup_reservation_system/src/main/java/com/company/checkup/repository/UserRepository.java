package com.company.checkup.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.company.checkup.domain.User;

public interface UserRepository extends JpaRepository<User, Long> {
	
	boolean existsByEmployeeNo(String employeeNo);
	boolean existsByEmail(String email);
	
	Optional<User> findByEmployeeNo(String employeeNo);
}
