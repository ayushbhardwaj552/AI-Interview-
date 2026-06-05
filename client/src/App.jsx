import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Home } from "./pages/Home";
import  Auth  from "./pages/Auth";
import axios from "axios";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setUserData } from "./redux/userSlice";
import { InterviewPage } from "./pages/InterviewPage";
import { InterviewHistory } from "./pages/InterviewHistory";
import { Pricing } from "./pages/Pricing";
import { InterviewReport } from "./pages/InterviewReport";

export const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:8000";

function App(){
  const dispatch = useDispatch();

  useEffect(()=>{
  const getUser = async()=>{
    try{
      const result = await axios.get(
        serverUrl + "/api/user/current-user",
        { withCredentials: true }
      );
      dispatch(setUserData(result.data.user));
    }
    catch(err){ 
      console.log(err);
      dispatch(setUserData(null));
    }
  }

  getUser(); 

},[dispatch])

  return(
    <div>
      <Routes>
        <Route path ='/' element = {<Home/>}/>
        <Route path = '/Auth' element = {<Auth/>}/>
        <Route path = '/interview' element = {<InterviewPage/>}/>
        <Route path = '/history' element = {<InterviewHistory/>}/>
        <Route path = '/pricing' element = {<Pricing/>}/>
        <Route path = '/report/:id' element = {<InterviewReport/>}/>
      </Routes>
    </div>
  )
}
export default App;
 
