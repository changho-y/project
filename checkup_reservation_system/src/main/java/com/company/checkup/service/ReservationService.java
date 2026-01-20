package com.company.checkup.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.company.checkup.domain.Reservation;
import com.company.checkup.domain.ReservationResponse;
import com.company.checkup.domain.ReservationStatus;
import com.company.checkup.domain.User;
import com.company.checkup.dto.CreateReservationRequest;
import com.company.checkup.repository.ReservationRepository;
import com.company.checkup.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class ReservationService {

	private final ReservationRepository reservationRepository;
	private final UserRepository userRepository;
	
	// 예약 생성
	public Long create(CreateReservationRequest request) {
		User user = userRepository.findByEmployeeNo(request.getEmployeeNo())
				.orElseThrow(() -> new IllegalArgumentException("해당 사번의 사용자가 없습니다."));
		LocalDate date = LocalDate.parse(request.getCheckupDate());
		
		// 같은 날짜+ 시간대에 이미 예약 있는 경우
		boolean exists = reservationRepository.existsByCheckupDateAndTimeSlotAndStatus(
				date, request.getTimeSlot(), ReservationStatus.RESERVED);
		
		if(exists) {
			throw new IllegalArgumentException("해당 시간에는 이미 예약이 존재합니다.");
		}
		
		Reservation reservation = new Reservation(user, date, request.getTimeSlot());
		Reservation saved = reservationRepository.save(reservation);
		
		return saved.getId();
	}
	// 내 예약 조회
	@Transactional(readOnly = true)
	public List<ReservationResponse> findMyReservations(String employeeNo){
		User user = userRepository.findByEmployeeNo(employeeNo)
			.orElseThrow(() -> new IllegalArgumentException("해당 사번의 사용자가 없습니다."));
		
		return reservationRepository.findByUserIdOrderByCheckupDateAsc(user.getId())
				.stream()
				.map(r -> new ReservationResponse(
						r.getId(),
						r.getCheckupDate().toString(),
						r.getTimeSlot(),
						r.getStatus().name()
						)).toList();
	}
	
	// 예약 취소
	public void cancel(Long reservationId, String employeeNo) {
		User user = userRepository.findByEmployeeNo(employeeNo)
				.orElseThrow(() -> new IllegalArgumentException("해당 사번의 사용자가 없습니다."));
		
		Reservation reservation = reservationRepository.findByIdAndUserId(reservationId,  user.getId())
				.orElseThrow(() -> new IllegalArgumentException("예약이 없거나 본인 예약이 아닙니다."));
		
		reservation.cancel();
		
	}
	
	@Transactional(readOnly = true)
	public List<String> getAvailableSlots(String checkupDate){
		LocalDate date = LocalDate.parse(checkupDate);
		
		// 운영 시간대: 09:00~17:00
		List<String> allSlots = new ArrayList<>();
		for(int hour=9; hour<17; hour++) {
			LocalTime start = LocalTime.of(hour, 0);
			LocalTime end = start.plusHours(1);
			allSlots.add(String.format("%02d:00-%02d:00", start.getHour(), end.getHour()));
		}
		
		List<String> reserved = reservationRepository.findReservedSlots(date, ReservationStatus.RESERVED);
		Set<String> reservedSet = new HashSet<>(reserved);
		
		return allSlots.stream()
				.filter(slot -> !reservedSet.contains(slot))
				.toList();
	}
}
