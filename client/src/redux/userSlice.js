import {createSlice} from "@reduxjs/toolkit";

const userSlice = createSlice({
    name:"user",
    initialState:{
        userData:null,
        initialized: false,   // true after current-user API resolves (success OR failure)
    },
    reducers:{
        setUserData:(state, action)=>{
            state.userData = action.payload;
            state.initialized = true;
        }
    }
})

export const {setUserData} = userSlice.actions;
export default userSlice.reducer;
