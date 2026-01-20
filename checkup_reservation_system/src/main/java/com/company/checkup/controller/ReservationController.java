package com.company.checkup.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.company.checkup.domain.ReservationResponse;
import com.company.checkup.dto.CreateReservationRequest;
import com.company.checkup.service.ReservationService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/reservations")
public class ReservationController {

	private final ReservationService reservationService;
	
	// 예약 생성
	@PostMapping
	public ResponseEntity<Long> create(@Valid @RequestBody CreateReservationRequest request){
		Long id = reservationService.create(request);
		return ResponseEntity.ok(id);
	}
	
	// 내 예약 조회
	@GetMapping("/me")
	public ResponseEntity<List<ReservationResponse>> myReservations(@RequestParam String employeeNo){
		return ResponseEntity.ok(reservationService.findMyReservations(employeeNo));
	}
	
	// 예약 취소
	@PostMapping("/{id}/cancel")
	public ResponseEntity<Void> cancel(@PathVariable Long id, @RequestParam String employeeNo){
		reservationService.cancel(id, employeeNo);
		return ResponseEntity.ok().build();
	}
	
	@GetMapping("/available-slots")
	public ResponseEntity<List<String>> availableSlots(@RequestParam String date) {
		return ResponseEntity.ok(reservationService.getAvailableSlots(date));
	}
}
