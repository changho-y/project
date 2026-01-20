package com.company.checkup.domain;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor
public class User {
	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
	
	// 사번 : 로그인 ID로 사용
	@Column(nullable = false, unique = true, length = 20)
	private String employeeNo;
	
	@Column(nullable = false, length = 50)
	private String name;
	
	@Column(nullable = false, unique = true)
	private String email;
	
	@Column(nullable = false)
	private String password;
	
	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private Role role;
	
	@Column(nullable = false)
	private LocalDateTime createdAt = LocalDateTime.now();
	
	public User(String employeeNo,
			String name,
			String email,
			String password,
			Role role) {
	
	this.employeeNo = employeeNo;
	this.name = name;
	this.email = email;
	this.password = password;
	this.role = role;
}
}

