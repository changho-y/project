package com.company.checkup.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.company.checkup.domain.Role;
import com.company.checkup.domain.User;
import com.company.checkup.dto.SignupRequest;
import com.company.checkup.repository.UserRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	
	public User signup(SignupRequest request) {
		
		if(userRepository.existsByEmployeeNo(request.getEmployeeNo())) {
			throw new IllegalArgumentException("이미 존재하는 사번입니다.");
		}
		
		if(userRepository.existsByEmail(request.getEmail())) {
			throw new IllegalArgumentException("이미 존재하는 이메일입니다.");
		}
		
		User user = new User(
				request.getEmployeeNo(),
				request.getName(),
				request.getEmail(),
				passwordEncoder.encode(request.getPassword()),
				Role.USER
				);
		
		return userRepository.save(user);
	}
}
