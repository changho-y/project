package com.company.checkup.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.company.checkup.domain.Reservation;
import com.company.checkup.domain.ReservationStatus;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {

	boolean existsByCheckupDateAndTimeSlotAndStatus(LocalDate checkupDate, String timeSlot, ReservationStatus status);
	List<Reservation> findByUserIdOrderByCheckupDateAsc(Long userId);
	
	Optional<Reservation> findByIdAndUserId(Long id, Long userId);
	
	@Query("select r.timeSlot from Reservation r where r.checkupDate = :date and r.status = :status")
	List<String> findReservedSlots(@Param("date") LocalDate date, @Param("status") ReservationStatus status);
}
