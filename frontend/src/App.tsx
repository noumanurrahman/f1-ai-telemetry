import {useState} from 'react'
import {Button} from "@/components/ui/button";

function App() {
    const [count, setCount] = useState(0)

    return (
        <section className={"max-w-5xl mx-auto py-12"}>
            <h1>{count}</h1>

            <Button onClick={() => setCount(count + 1)}>Increment</Button>
        </section>
    )
}

export default App
