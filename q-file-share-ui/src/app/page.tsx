"use client";

import { redirect } from "next/navigation";

import { isValidToken } from "@/utils";

const Home = (): JSX.Element => {
  const pageToLoad = isValidToken() ? "/dashboard" : "/login";

  redirect(pageToLoad);
};

export default Home;
