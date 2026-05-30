import Card from "./CardContainer";

export default function Register(){
    return(
        <div className="flex w-full bg-white-5 h-screen items-center justify-center">
            <Card>
                <div className="flex flex-col w-full items-center">
                    <p className="text-xl font-bold text-blue-20">Join BrainBot</p>
                    <p className="text-m">Experience the future of intelligent collaboration.</p>
                </div>
            </Card> 
        </div>

    )
}