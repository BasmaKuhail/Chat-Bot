import ChatContainer from "../chat/ChatContainer";
import SideNav from "../SideNav";

export default function Home(){
    return(
    <div className="flex w-full flex-col bg-white-10 min-h-screen">
      
      <div className="flex flex-row">
        <SideNav />
        
        <div className="flex w-full flex-col gap-4 px-3 pt-20 md:ml-70 md:px-10 md:pt-10">
          <ChatContainer/>
        </div>
      </div>
      
    </div>
    )
}
