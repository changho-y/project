# 🛸 드론 통합 플랫폼 (Drone Integrated Platform)

> **복잡한 드론 명령어를 시각적 블록으로 재구성한 지능형 드론 미션 설계 플랫폼**

---

## 📌 프로젝트 개요
* **개발 기간**: 2025.10.14 ~
* **주요 기능**: 직관적인 블록 코딩 인터페이스, 드론 특화 커스텀 블록 라이브러리, 고수준 통합 이동 로직, 안전한 데스크탑 실행 환경
* **목표**: 복잡한 드론 명령어를 아이들의 눈높이에 맞춘 블록 코딩으로 변환
* **추가 예정**: 블록을 Python이나 JavaScript 코드로 변환하는 기능, 실제 드론과 통신하는 모듈 추가

## 🛠 Tech Stack
| 구분 | 기술 스택 | 설명 |
| :--- | :--- | :--- |
| **Framework** | Electron | 크로스 플랫폼 데스크탑 앱 프레임워크(v39.2.7) |
| **Block Engine** | Blockly | 구글의 비주얼 블록 프로그래밍 라이브러리 |
| **Frontend** | HTML5, CSS3, JavaScript | 사용자 인터페이스 및 렌더링 로직 |
| **Runtime** | Node.js | 백엔드 로직 및 모듈 관리 |
| **Build Tool** | electron-builder | Windows 실행 파일(.exe) 빌드 및 배포 도구 |

## ✨ 핵심 기능 (Key Features)

### 1. 실시간 기체 관제 (Real-time Monitoring)
* **Telemetry 데이터**: 고도, 속도, 배터리 잔량 등을 실시간 대시보드로 확인
* **지도 연동**: 현재 드론의 위치를 지도 위에 마커로 표시 및 이동 경로(Breadcrumbs) 출력

### 2. 드론 미션 제어 (Mission Control)
* Waypoint 설정 및 전송 기능
* 이륙(Take-off), 착륙(Land), 복귀(RTL) 원격 명령 제어

### 3. 데이터 분석 및 로그 관리
* 비행 로그 자동 저장 및 그래프 시각화
* 과거 비행 기록 다시보기(Playback) 기능

## 📸 실행 화면 (Screenshots)
| 메인 대시보드 | 실시간 경로 트래킹 |
| :---: | :---: |
| <img src="이미지주소1" width="400"> | <img src="이미지주소2" width="400"> |

## 🚀 시작하기 (Installation)

```bash
# 레포지토리 클론
git clone [https://github.com/사용자이름/drone-platform.git](https://github.com/사용자이름/drone-platform.git)

# 의존성 설치
npm install

# 실행
npm start
