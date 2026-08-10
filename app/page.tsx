'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart3, Users, CheckCircle2, TrendingUp, Clock } from 'lucide-react'

interface Poll {
  id: string
  title: string
  description: string | null
  poll_type: string
  vote_count?: number
  created_at: string
}

export default function Home() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [recentPolls, setRecentPolls] = useState<Poll[]>([])
  const [stats, setStats] = useState({ totalPolls: 0, totalVotes: 0 })

  

  const fetchRecentPolls = async () => {
    try {
      const { data, error } = await supabase
        .from('polls')
        .select(`
          *,
          votes(count)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(3)

      if (error) throw error

      const pollsWithVoteCount = data?.map((poll: any) => ({
        ...poll,
        vote_count: poll.votes?.[0]?.count || 0,
      })) || []

      setRecentPolls(pollsWithVoteCount)
    } catch (error) {
      console.error('Error fetching recent polls:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const [{ count: totalPolls }, { count: totalVotes }] = await Promise.all([
        supabase.from('polls').select('*', { count: 'exact', head: true }),
        supabase.from('votes').select('*', { count: 'exact', head: true }),
      ])

      setStats({
        totalPolls: totalPolls || 0,
        totalVotes: totalVotes || 0,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }
useEffect(() => {
    if (user) {
      fetchRecentPolls();
      fetchStats()
    }
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  // Logged out view - Landing page
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Welcome to Polling App
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Create and participate in polls with ease. Share your opinions and gather insights from your community.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Create Polls</CardTitle>
                <CardDescription>
                  Design single or multiple choice polls with custom options
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Share & Vote</CardTitle>
                <CardDescription>
                  Share polls with your community and collect real-time votes
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>View Results</CardTitle>
                <CardDescription>
                  Analyze voting patterns and see instant results
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="flex justify-center gap-4">
            <Button size="lg" onClick={() => router.push('/login')}>
              Login
            </Button>
            <Button size="lg" variant="outline" onClick={() => router.push('/signup')}>
              Sign Up
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Logged in view - Dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome back!</h1>
          <p className="text-gray-600">Here's what's happening with your polls</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Polls</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPolls}</div>
              <p className="text-xs text-muted-foreground">Active polls in system</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Votes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVotes}</div>
              <p className="text-xs text-muted-foreground">Votes cast across all polls</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Your Activity</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Active</div>
              <p className="text-xs text-muted-foreground">Ready to participate</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Polls */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Recent Polls</h2>
            <Button variant="outline" onClick={() => router.push('/polls')}>
              View All
            </Button>
          </div>

          {recentPolls.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-600">No polls available yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recentPolls.map((poll) => (
                <Card key={poll.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push(`/polls/${poll.id}`)}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{poll.title}</CardTitle>
                      <Badge variant={poll.poll_type === 'single' ? 'default' : 'secondary'}>
                        {poll.poll_type === 'single' ? 'Single' : 'Multiple'}
                      </Badge>
                    </div>
                    {poll.description && (
                      <CardDescription className="line-clamp-2">{poll.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{poll.vote_count} votes</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{new Date(poll.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/polls')}>
            <CardHeader>
              <CardTitle>Browse All Polls</CardTitle>
              <CardDescription>View and vote on all active polls</CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/dashboard')}>
            <CardHeader>
              <CardTitle>Go to Dashboard</CardTitle>
              <CardDescription>Manage your polls and view detailed statistics</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  )
}
