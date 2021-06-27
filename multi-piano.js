// ==UserScript==//
// @name         multiple piano
// @version      1.0
// @description  auto play midi
// @author       doyu
// @match        https://multiplayerpiano.com/*
// @require      https://cdn.jsdelivr.net/npm/sweetalert2@11.0.18/dist/sweetalert2.all.min.js
// @require      https://www.visipiano.com/midi-to-json-converter/build/MidiConvert.js
// @grant        none
// ==/UserScript==

let musicInfo = {};

let stop = true;

async function play() {
    let notes = mergeParts();
    let time = 0;

    for(let i = 0; i < notes.length; i++) {
        let ms = Math.floor(notes[i].time * 1000);
        if(ms - time > 1)
            await delay(ms - time);

        time = ms;
        let code = formatCode(notes[i].name);
        MPP.press(code, 2);

        if(stop) {
            stop = false;
            return;
        }
    }
}

function mergeParts() {
    let notes = musicInfo.tracks[0].notes;
    for(let i = 1, len = musicInfo.tracks.length; i < len; i++) {
        let nowNotes = musicInfo.tracks[i].notes;

        for(let j = 0; j < nowNotes.length; j++) {
            let index = findSeatIndex(notes, nowNotes[j].time);

            notes.splice(index, 0, nowNotes[j]);
        }
    }

    return notes;
}

function findSeatIndex(notes, dstTime) {
    for(let i = 0; i < notes.length; i++) {
        if(notes[i].time >= dstTime) return i;
    }
    return notes.length;
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function formatCode(code) {
    return code.toLowerCase().replace("#", "s");
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

