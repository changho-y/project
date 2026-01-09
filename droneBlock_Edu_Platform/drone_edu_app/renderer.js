window.addEventListener('DOMContentLoaded', () => {
    const Blockly = require('blockly');
    require('blockly/msg/ko'); // 한국어 팩 로드

// 1. 드론 이륙 블록
    Blockly.Blocks['drone_takeoff'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("드론 이륙하기");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour("#4a90e2");
            this.setTooltip("드론을 이륙시킵니다.");
            this.setHelpUrl("");
        }
    };

    // 2. 드론 착륙 블록
    Blockly.Blocks['drone_land'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("드론 착륙하기");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour("#4a90e2");
            this.setTooltip("드론을 착륙시킵니다.");
            this.setHelpUrl("");
        }
    };

    // 3. 드론 상승 블록
    Blockly.Blocks['drone_up'] = {
        init: function() {
            this.appendValueInput("DISTANCE")
                .setCheck("Number")
                .appendField("드론 상승 (cm):");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour("#4a90e2");
            this.setTooltip("드론을 지정한 높이만큼 상승시킵니다.");
            this.setHelpUrl("");
        }
    };

    // 4. 드론 하강 블록
    Blockly.Blocks['drone_down'] = {
        init: function() {
            this.appendValueInput("DISTANCE")
                .setCheck("Number")
                .appendField("드론 하강 (cm):");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour("#4a90e2");
            this.setTooltip("드론을 지정한 높이만큼 하강시킵니다.");
            this.setHelpUrl("");
        }
    };

    // 5. 드론 전진 블록
    Blockly.Blocks['drone_forward'] = {
        init: function() {
            this.appendValueInput("DISTANCE")
                .setCheck("Number")
                .appendField("드론 전진 (cm):");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour("#4a90e2");
            this.setTooltip("드론을 지정한 거리만큼 전진시킵니다.");
            this.setHelpUrl("");
        }
    };

    // 6. 드론 후진 블록
    Blockly.Blocks['drone_backward'] = {
        init: function() {
            this.appendValueInput("DISTANCE")
                .setCheck("Number")
                .appendField("드론 후진 (cm):");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour("#4a90e2");
            this.setTooltip("드론을 지정한 거리만큼 후진시킵니다.");
            this.setHelpUrl("");
        }
    };

    // 7. 드론 좌회전 블록
    Blockly.Blocks['drone_turn_left'] = {
        init: function() {
            this.appendValueInput("ANGLE")
                .setCheck("Number")
                .appendField("드론 좌회전 (도):");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour("#4a90e2");
            this.setTooltip("드론을 지정한 각도만큼 좌회전시킵니다.");
            this.setHelpUrl("");
        }
    };

    // 8. 드론 우회전 블록
    Blockly.Blocks['drone_turn_right'] = {
        init: function() {
            this.appendValueInput("ANGLE")
                .setCheck("Number")
                .appendField("드론 우회전 (도):");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour("#4a90e2");
            this.setTooltip("드론을 지정한 각도만큼 우회전시킵니다.");
            this.setHelpUrl("");
        }
    };

    // 9. 통합 드론 이동 블록
    Blockly.Blocks['drone_move_unified'] = {
        init: function() {
            this.appendDummyInput() 
                .appendField("드론")
                .appendField(new Blockly.FieldDropdown([
                    ["앞", "forward"],
                    ["뒤", "backward"],
                    ["왼쪽", "left"],
                    ["오른쪽", "right"],
                    ["위", "up"],
                    ["아래", "down"]
                ]), "DIRECTION")
                .appendField("으로")
                .appendField(new Blockly.FieldTextInput("1"), "METER") // 숫자 입력
                .appendField("m를")
                .appendField(new Blockly.FieldTextInput("1"), "SPEED") // 숫자 입력
                .appendField("m/s로 이동");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour("#4a90e2");
            this.setTooltip("드론을 지정한 방향으로 특정 거리와 속도로 이동시킵니다.");
            this.setHelpUrl("");
        }
    };


// --- Blockly 작업 공간 주입 ---

// 1. 툴박스 XML 요소를 가져옵니다.
const toolboxXml = document.getElementById('toolbox');

// 2. Blockly 옵션 설정
const blocklyOptions = {
    toolbox: toolboxXml,
    renderer: 'zelos',
    grid: {
        spacing: 20,
        length: 3,
        colour: '#ccc',
        snap: true
    },
    zoom: {
        controls: true,
        wheel: true,
        startScale: 1.0,
        maxScale: 3,
        minScale: 0.3,
        scaleSpeed: 1.2
    },
    trashcan: true
};

// 3. Blockly 작업 공간을 'blocklyDiv'에 주입
const workspace = Blockly.inject('blocklyDiv', blocklyOptions);

console.log("Blockly 작업 공간이 성공적으로 초기화되었습니다.");
});
