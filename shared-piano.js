// ==UserScript==//
// @name         musiclab piano
// @namespace    https://gist.github.com/lemon-mint/ce66fdafe9dc20889bd6b9f4cb81f657
// @version      1.4
// @description  auto play midi
// @author       doyu
// @match        https://musiclab.chromeexperiments.com/Shared-Piano/*
// @grant        none
// @require      https://cdn.jsdelivr.net/npm/sweetalert2@11.0.18/dist/sweetalert2.all.min.js
// @require      https://www.visipiano.com/midi-to-json-converter/build/MidiConvert.js
// ==/UserScript==

const soundMap = {
    "C": 0,
    "D": 1,
    "E": 2,
    "F": 3,
    "G": 4,
    "A": 5,
    "B": 6,
    "C#": 7,
    "D#": 8,
    "F#": 9,
    "G#": 10,
    "A#": 11
}
let keyboardMap = getKeyboardList();
let musicInfo = {};

let stop = true;

async function play() {
    (async () => {
        let notes = mergeParts();
        let time = 0;

        for (let i = 0; i < notes.length; i++) {
            let ms = Math.floor(notes[i].time * 1000);
            if (ms - time > 1) {
                await delay(ms - time);
            }

            time = ms;
            let code = decompCode(notes[i].name);
            press(code.key, code.octave, notes[i].duration * 1000);
            if (stop) {
                stop = false;
                return
            }
        }
    })()
}

async function press(key, octave, ms) {
    keyboardMap[octave][soundMap[key]].clicked = true;
    await delay(ms);
    keyboardMap[octave][soundMap[key]].clicked = false;
}

function mergeParts() {
    let notes = musicInfo.tracks[0].notes;
    for (let i = 1, len = musicInfo.tracks.length; i < len; i++) {
        let nowNotes = musicInfo.tracks[i].notes;

        for (let j = 0; j < nowNotes.length; j++) {
            let index = findSeatIndex(notes, nowNotes[j].time);

            notes.splice(index, 0, nowNotes[j]);
        }
    }

    return notes;
}

function findSeatIndex(notes, dstTime) {
    for (let i = 0; i < notes.length; i++) {
        if (notes[i].time >= dstTime) return i;
    }
    return notes.length;
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function decompCode(code) {
    if (code.length == 2) {
        return { key: code[0], octave: code[1] };
    }
    else {
        return { key: code.slice(0, 2), octave: code[2] };
    }
}

function getKeyboardList() {
    let octaves = document.querySelector("#piano > piano-keyboard")
        .shadowRoot
        .querySelectorAll("#container > piano-keyboard-octave");

    let keyboardList = [];
    let result = [];

    for (let i of octaves) {
        keyboardList.push(i.shadowRoot.querySelectorAll("piano-keyboard-note"));
    }

    for (let i in keyboardList) {
        result[i] = [];
        for (let j in keyboardList[i]) {
            if (j > 13) {
                break
            };
            if (!(["7", "10", "14"].includes(j))) {
                result[i].push(keyboardList[i][j]);
            }
        }
    }

    return result;
}
document.addEventListener("keydown", event => {
    if (event.key == 'm' && event.ctrlKey) {
        const midi = window.prompt("midi???", "");
        musicInfo = JSON.parse(midi);
        play();
    }
    if (event.key == 'x' && event.ctrlKey) {
        stop = true;
    }
    if (event.key == 'i' && event.ctrlKey) {

        Swal.fire({
            title: "Input MIDI",
            text: "Use https://www.visipiano.com/midi-to-json-converter/",
            input: 'text',
            showCancelButton: true
        }).then((result) => {
            if (result.value) {
                const midi = result.value;
                musicInfo = JSON.parse(midi);
                stop = false;
                play();
            }
        });
    }
    if (event.key == 'q' && event.ctrlKey) {

        Swal.fire({
            title: "Input MIDI",
            input: 'file',
            showCancelButton: true
        }).then((result) => {
            if (result.value) {
                const file = result.value;
                var reader = new FileReader();
                reader.onload = function (e) {
                    musicInfo = MidiConvert.parse(e.target.result);
                    stop = false;
                    play();
                };
                reader.readAsBinaryString(file);
            }
        });
    }
});
