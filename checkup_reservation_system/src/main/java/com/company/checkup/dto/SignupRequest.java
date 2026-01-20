package com.company.checkup.dto;

import lombok.Getter;

@Getter
public class SignupRequest {
	
	private String employeeNo;
	private String name;
	private String email;
	private String password;
}
