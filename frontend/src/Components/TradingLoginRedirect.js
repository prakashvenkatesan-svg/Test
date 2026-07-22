import React, { useEffect } from "react";

import "../Style.css";

const TRADING_LOGIN_URL = "https://tradeplus.aionioncapital.com/";

const TradingLoginRedirect = () => {
  useEffect(() => {
    window.location.replace(TRADING_LOGIN_URL);
  }, []);

  return (
    <div className='login-container trading-login-container'>
      <h2>Trading Login</h2>
      <p className='trading-login-copy'>
        Redirecting you to the Tradeplus login portal.
      </p>
      <a className='trading-login-link' href={TRADING_LOGIN_URL}>
        Continue to Trading Login
      </a>
    </div>
  );
};

export default TradingLoginRedirect;
