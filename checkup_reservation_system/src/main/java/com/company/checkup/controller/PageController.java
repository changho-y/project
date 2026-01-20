package com.company.checkup.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class PageController {

	@GetMapping("/reserve")public String reservePage() {
		return "reserve"; // templates/reserve.html
	}
}
