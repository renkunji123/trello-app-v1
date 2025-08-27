import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import logo from '../img/logo.png';

export default function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  const handleSignUp = async (e) => {
    e.preventDefault();
    const response = await fetch("http://localhost:3000/auth/request-code-signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const data = await response.json();
    if (response.ok) {
      navigate("/verify-otp", { state: { email, authType: "signup" } });
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vw-100 vh-100 bg-light">
      <form onSubmit={handleSignUp} className="border rounded p-4 bg-white shadow" style={{ width: '500px', textAlign: 'center', padding: '50px' }}>
        <img className="mb-3" style={{ width: '100px', height: '100px' }} src={logo} alt="logo" />
        <p className='mb-3'>Create new account </p>
        <input
          type="email"
          className="form-control mb-3 h-50px text-center"
          placeholder="Enter your email"
          value={email}
          style={{ height: "50px" }}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type='submit' className="btn btn-primary w-100 mb-2" style={{ height: "50px" }}>Create</button>
        <p>Privacy Policy</p>
        <p>This site is protected by reCAPCHA and the Google Privacy </p>
        <a href="https://facebook.com">Policy and Terms of Service apply</a>
      </form>
    </div>
  );
}
