package com.company.checkup.domain;

import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(
		name = "reservations",
		uniqueConstraints = {
				@UniqueConstraint(name = "uk_reservation_date_slot_status", columnNames = {"checkup_date", "time_slot", "status"})
		})
@Getter
@NoArgsConstructor
public class Reservation {
	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
	
	// 예약한 직원
	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id")
	private User user;
	
	// 검진 날짜
	@Column(name = "checkup_date", nullable = false)
	private LocalDate checkupDate;
	
	// 시간대
	@Column(name = "time_slot", nullable = false, length = 20)
	private String timeSlot;
	
	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private ReservationStatus status = ReservationStatus.RESERVED;
	
	@Column(nullable = false)
	private LocalDateTime createdAt = LocalDateTime.now();
	
	public Reservation(User user, LocalDate checkupDate, String timeSlot) {
		this.user = user;
		this.checkupDate = checkupDate;
		this.timeSlot = timeSlot;
		this.status = ReservationStatus.RESERVED;
	}
	
	public void cancel() {
		this.status = ReservationStatus.CANCELED;
	}
}
