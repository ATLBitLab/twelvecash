"use client";

import Button from "../components/Button";
import Input from "../components/Input";
import { SearchIcon } from "@bitcoin-design/bitcoin-icons-react/filled";
import { Inter } from 'next/font/google'
import { useState } from "react";

const inter = Inter({ subsets: ['latin'] })

type SearchFormProps = {
    defaultDomain: string;
}

export default function SearchForm(props:SearchFormProps) {
    const [userNameToCheck, setUserNameToCheck] = useState("stephen@" + props.defaultDomain);

    const updateUserNameToCheck = (value:string) => {
        setUserNameToCheck(value);
    }

  return (
      <>
        <h1>Check Payment Code</h1>
        <div className={inter.className + " text-purple-800"}>
          <Input value={userNameToCheck} prepend="₿" onChange={updateUserNameToCheck} placeholder={"satoshi@" + props.defaultDomain} />
        </div>
        <div className="flex flex-row items-center justify-center">
            <Button href={"/" + userNameToCheck} size="large">Check Pay Code <SearchIcon className="w-6 h-6" /></Button>
        </div>
      </>
  );
}
