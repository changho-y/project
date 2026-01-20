package com.company.checkup.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;

@Getter
public class CreateReservationRequest {

	@NotBlank(message = "사번은 필수입니다.")
	private String employeeNo;
	
	@NotBlank(message = "검진날짜는 필수입니다.")
	@Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$", message = "검진날짜 형식은 yyyy-mm-dd 입니다.")
	private String checkupDate;
	
	@NotBlank(message = "검진시간은 필수입니다.")
	@Pattern(regexp = "^\\d{2}:\\d{2}-\\d{2}:\\d{2}$", message = "검진시간 형식은 HH:mm-HH:mm 입니다.")
	private String timeSlot;
}
