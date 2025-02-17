"use client"

import { useState, useEffect } from "react"
import { Battery } from "lucide-react"
import { auth, db } from "./firebase"
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth"
import { doc, setDoc, onSnapshot } from "firebase/firestore"
import { Button } from "@/components/ui/button"

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(7200) // 2 hours in seconds
  const [canClick, setCanClick] = useState(true)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user)
        const userRef = doc(db, "users", user.uid)
        onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            const data = doc.data()
            setScore(data.score || 0)
            setTimeLeft(data.timeLeft || 7200)
            setCanClick(data.canClick !== false)
          }
        })
      } else {
        setUser(null)
      }
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) return

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 0) {
          setCanClick(true)
          updateUserData({ timeLeft: 7200, canClick: true })
          return 7200
        }
        updateUserData({ timeLeft: prevTime - 1 })
        return prevTime - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [user])

  const updateUserData = async (data: any) => {
    if (!user) return
    const userRef = doc(db, "users", user.uid)
    await setDoc(userRef, data, { merge: true })
  }

  const handleClick = async () => {
    if (canClick && user) {
      const newScore = score + 30
      setScore(newScore)
      setCanClick(false)
      setTimeLeft(7200)
      await updateUserData({ score: newScore, canClick: false, timeLeft: 7200 })
    }
  }

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth, provider)
    } catch (error) {
      console.error("Error during login:", error)
    }
  }

  const hours = Math.floor(timeLeft / 3600)
  const minutes = Math.floor((timeLeft % 3600) / 60)
  const seconds = timeLeft % 60

  const batteryPercentage = (timeLeft / 7200) * 100

  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-black p-4">
        <Button onClick={handleLogin} className="bg-white text-black hover:bg-gray-200">
          Login com Google
        </Button>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between bg-black p-4">
      <div className="text-white text-4xl mb-8">Saldo: {score} pontos</div>
      <div className="flex-grow flex items-center justify-center">
        <div className="relative w-64 h-32 border-4 border-white rounded-2xl overflow-hidden mb-4">
          <div
            className="absolute top-0 left-0 h-full bg-green-400"
            style={{ width: `${batteryPercentage}%`, transition: "width 1s linear" }}
          ></div>
          <Battery className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 text-black" />
        </div>
      </div>
      <div className="w-full flex flex-col items-center">
        <div className="text-white text-3xl mb-4">
          {hours.toString().padStart(2, "0")}:{minutes.toString().padStart(2, "0")}:
          {seconds.toString().padStart(2, "0")}
        </div>
        <Button
          onClick={handleClick}
          className={`bg-white text-black text-xl font-bold py-3 px-6 rounded-lg mb-8 ${
            !canClick && "opacity-50 cursor-not-allowed"
          }`}
          disabled={!canClick}
        >
          Clique (+30 pontos)
        </Button>
      </div>
    </main>
  )
}

