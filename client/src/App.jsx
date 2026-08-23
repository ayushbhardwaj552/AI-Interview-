import React from "react";
import { Routes, Route } from "react-router-dom";
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
// Admin
import AdminRoute from "./components/AdminRoute";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminUserDetail from "./pages/admin/AdminUserDetail";
import AdminInterviews from "./pages/admin/AdminInterviews";
import AdminInterviewDetail from "./pages/admin/AdminInterviewDetail";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminAnalytics from "./pages/admin/AdminAnalytics";

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
      if (err.response?.status !== 401) {
        console.error("Error fetching current user:", err.message);
      }
      dispatch(setUserData(null));   // sets initialized:true even on failure
    }
  }

  getUser(); 

},[dispatch])

  return(
    <div>
      <Routes>
        {/* ── Existing user routes ── */}
        <Route path ='/' element = {<Home/>}/>
        <Route path = '/Auth' element = {<Auth/>}/>
        <Route path = '/interview' element = {<InterviewPage/>}/>
        <Route path = '/history' element = {<InterviewHistory/>}/>
        <Route path = '/pricing' element = {<Pricing/>}/>
        <Route path = '/report/:id' element = {<InterviewReport/>}/>

        {/* ── Admin routes — all protected by AdminRoute ── */}
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<AdminOverview />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="users/:id" element={<AdminUserDetail />} />
          <Route path="interviews" element={<AdminInterviews />} />
          <Route path="interviews/:id" element={<AdminInterviewDetail />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="analytics" element={<AdminAnalytics />} />
        </Route>
      </Routes>
    </div>
  )
}
export default App;
