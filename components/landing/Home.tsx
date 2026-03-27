import ChatContainer from "../chat/ChatContainer";
import Header from "../Header";
import Input from "../Input";
import SideNav from "../SideNav";

export default function Home(){
    return(
    <div className="flex w-full flex-col bg-white-10 min-h-screen">
      
      <div className="flex flex-row ">
        <SideNav />
        
        <div className="flex flex-col pt-10 px-10 gap-4 ml-70">
          <ChatContainer/>
          <Input/>
        </div>
      </div>
      
    </div>
    )
}