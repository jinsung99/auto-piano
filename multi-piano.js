let musicInfo = {};

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