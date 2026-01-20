package com.company.checkup.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.company.checkup.dto.SignupRequest;
import com.company.checkup.service.UserService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class UserController {
	
	private final UserService userService;
	
	// 회원가입
	@PostMapping("/signup")
	public ResponseEntity<Void> signup(@RequestBody SignupRequest request){
		userService.signup(request);
		return ResponseEntity.ok().build();
	}
}
