import { useState, useEffect } from "react";
import useAuth from "./useAuth";
import DrawRadar from "./DrawRadar";
import SpotifyWebApi from "spotify-web-api-node";

const spotifyApi = new SpotifyWebApi({
    clientId: "9bc2ed28c5124518a2b45d4d3d514721",
})

const getAverageFeatures = (arr) => {
    let length = arr.length;
    let duration = 0;
    let tempo = 0;
    let energy = 0;
    let mood = 0;
    let popularity = 0;

    arr.forEach(thing => {
        duration += thing.duration;
        tempo += thing.tempo;
        energy += thing.energy;
        mood += thing.mood;
        popularity += thing.popularity;
    })

    return {
        avgDuration: duration / length,
        avgTempo: tempo / length,
        avgEnergy: energy / length,
        avgMood: mood / length,
        avgPopularity: popularity / length,
    }
}

let gotAverages = false;
let tracks = new Array();

export default function TopTracks({ code }) {
    console.log(`TopTracks`);
    const accessToken = useAuth(code);
    const [shortAverages, setShortAverages] = useState();
    const [longAverages, setLongAverages] = useState();

    const getTopTracks = async (amount, range) => {
        spotifyApi.getMyTopTracks({ limit: amount, time_range: range }).then(res => {
            res.body.items.map(track => {
                spotifyApi.getAudioFeaturesForTrack(track.id).then((data) => {
                    tracks.push( {
                        name: track.name,
                        artists: track.artists[0].name,
                        energy: data.body.energy,
                        tempo: data.body.tempo,
                        popularity: track.popularity,
                        duration: track.duration_ms,
                        mood: data.body.valence,
                    });
                    if (tracks.length === amount) {
                        let result = getAverageFeatures(tracks);
                        gotAverages = true;
                        tracks = [];
                        (range === "short_term") ? setShortAverages(result) : setLongAverages(result);
                        return;
                    }
                })
            })
        })
    }

    useEffect(() => {
        if (!accessToken) return;
        spotifyApi.setAccessToken(accessToken);
    }, [accessToken]);

    useEffect(() => {
        if (!accessToken) return;
        getTopTracks(10, "short_term");
        getTopTracks(50, "long_term");
    }, [accessToken]);

    return (
        <div>
            Hello there
            {(gotAverages && shortAverages && longAverages) ? <DrawRadar data={{short_term: shortAverages, long_term: longAverages,}} /> : 0}
        </div>
    )
}
