import Header from "../Header";
import SideNav from "../SideNav";

export default function Home(){
    return(
    <div className="bg-white-10 w-full min-h-screen">
      <Header/>
      <div className="flex flex-row">
        <SideNav />
        <div className="pt-20 px-10">
          home
        </div>
      </div>
      
    </div>
    )
}