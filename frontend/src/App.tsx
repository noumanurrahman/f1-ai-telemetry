import {useState} from 'react'
import {Button} from "@/components/ui/button";
import {dataService} from "@/src/api/service.ts";
import {Input} from "@/components/ui/input.tsx";

function App() {
    const [result, setResult] = useState([])
    const [race, setRace] = useState<any>({})
    const [raceInput, setRaceInput] = useState(0)

    const fetchRace = () => {
        dataService.raceByRound(2026, raceInput).then((data) => {
            setRace(data)
        }).catch((err => {
            console.log(err)
        }))
    }

    const fetchResult = () => {
        dataService.result(2026, raceInput).then((data) => {
            setResult(data)
        }).catch((err => {
            console.log(err)
        }))
    }

    return (
        <section className={"max-w-5xl mx-auto py-12"}>
            <Input placeholder="which race to pull?" type={'number'} value={raceInput}
                   onChange={(e) => setRaceInput(Number(e.target.value))}/>
            <Button onClick={fetchRace}>Pull the race</Button>

            <h1>{race.eventName} {race.year}</h1>

            <Button onClick={fetchResult}>See result</Button>

            {result.map((item: any, i: number) => (
                <div key={i}>
                    <p>{item.classifiedPosition} – {item.driverName} [{item.points}]</p>
                </div>
            ))}
        </section>
    )
}

export default App
