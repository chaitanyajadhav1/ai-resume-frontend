import React, { useState } from "react";
import {useNavigate} from "react-router";
import { useAuth } from "../hooks/useAuth";

const Register =()=>{

    const navigate =useNavigate()
    const [email,setEmail]=useState("");
    const [username,setUsername]=useState("")
    const [password,setPassword]=useState("")
    
    const {loading ,handleRegister}=useAuth()



    const handleSubmi=async (e)=>{
     e.preventDefault()
     await handleRegister({username,email,password})
     navigate('/')
    }
    return (
        <main>
        <div className="form-container">
        <h1>Register</h1>

        <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="email">Email</label>
              <input 
              onChange={(e)=>{setEmail(e.target.value)}}
              type="email" id="email" name="email" 
              placeholder="Enter email address"/>
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input
              onChange={(e)=>{setPassword(e.target.value)}}
              type="password" id="password" name="password" 
              placeholder="Enter password"/>
            </div>

            <button className="button primary-button">Register</button>
        </form>
        </div>
        </main>
    )
}


export default Register
