//package com.company.checkup.controller;
//
//import org.springframework.http.ResponseEntity;
//import org.springframework.security.authentication.AuthenticationManager;
//import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
//import org.springframework.web.bind.annotation.PostMapping;
//import org.springframework.web.bind.annotation.RequestBody;
//import org.springframework.web.bind.annotation.RequestMapping;
//import org.springframework.web.bind.annotation.RestController;
//
//import com.company.checkup.dto.LoginRequest;
//
//import lombok.RequiredArgsConstructor;
//
//@RestController
//@RequestMapping("/api/auth")
//@RequiredArgsConstructor
//public class AuthController {
//
//    private final AuthenticationManager authenticationManager;
//    
//    // 로그인
//    @PostMapping("/login")
//    public ResponseEntity<Void> login(@RequestBody LoginRequest request){
//    	
//    	UsernamePasswordAuthenticationToken token =
//    			new UsernamePasswordAuthenticationToken(
//    					request.getEmployeeNo(),
//    					request.getPassword()
//    					);
//    	authenticationManager.authenticate(token);
//    	
//    	return ResponseEntity.ok().build();
//    }
//}
