import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';

export default function VerifyOtp() {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email;
    const [otp, setOtp] = useState("");
    const [popup, setPopup] = useState(false)
    const [authType, setAuthType] = useState("");
    const handleVerify = async (e) => {
        e.preventDefault();
        if (!otp.trim()) {

        }
        try {
            const response = await fetch("http://localhost:3000/auth/verify-code", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(
                    {
                        email,
                        code: otp.trim()
                    }
                ),
            }
            );

            const data = await response.json();

            if (response.ok && data.accessToken) {
                localStorage.setItem("token", data.accessToken);
                
                const type = location.state?.authType || "signin"
                setAuthType(type);
                setPopup(true);
                setTimeout(() => {
                    if (type === "signup") {
                        navigate("/signin", { state: { email } });
                    } else {
                        navigate("/dashboard");
                    }
                }, 2000);
            } else {
                alert(data.error || "Invalid OTP");
            }

        } catch (error) {
            alert(error.message);
        }
    };

    return (
        <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
            <form className="p-4 bg-white rounded shadow-sm text-center" style={{ width: "500px" }} onSubmit={handleVerify}>
                <h1 className="mb-3">Email Verification</h1>
                <p className="mb-3">Please enter your code that was sent to your email address</p>
                <input
                    type="text"
                    className="form-control mb-3 text-center"
                    style={{ height: '50px' }}
                    placeholder="Enter code Verification"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                />
                <button className="btn btn-primary w-100 btn-block" style={{height: '50px'}}>Submit</button>
                <p className="mt-3 mb-1 small text-muted">Privacy Policy</p>
                <p className="small text-muted">This site is protected by reCAPCHA and the Google Privacy </p>
                <a href="https://facebook.com" className="small d-block mb-0">Policy and Terms of Service apply</a>
            </form>
            {popup && (
                <div className="position-fixed top-50 start-50 translate-middle popup">
                    <div className="alert alert-success m-0 p-3">
                        {authType === "signup" ? (
                            <p>Signup Success, Please Login!</p>
                        ) : (
                            <p>Signin Success, Welcome back!</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
