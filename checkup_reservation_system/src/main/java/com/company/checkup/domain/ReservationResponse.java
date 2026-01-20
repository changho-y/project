package com.company.checkup.domain;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ReservationResponse {

	private Long reservationId;
	private String checkupDate;
	private String timeSlot;
	private String status;
}
