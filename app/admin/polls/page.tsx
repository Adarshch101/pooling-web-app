'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Trash2, Eye, Edit, BarChart3, Users } from 'lucide-react'

interface Poll {
  id: string
  title: string
  description: string | null
  poll_type: string
  file_url: string | null
  file_type: string | null
  created_at: string
  expires_at: string | null
  is_active: boolean
  vote_count?: number
}

export default function AdminPollsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; pollId: string }>({ open: false, pollId: '' })

  useEffect(() => {
    if (authLoading) return // Wait for auth to complete
    
    if (!user) {
      router.push('/login')
      return
    }
    fetchPolls()
  }, [user, authLoading])

  async function fetchPolls() {
    try {
      const { data, error } = await supabase
        .from('polls')
        .select(`
          *,
          votes(count)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const pollsWithVoteCount = data?.map((poll: any) => ({
        ...poll,
        vote_count: poll.votes?.[0]?.count || 0,
      })) || []

      setPolls(pollsWithVoteCount)
    } catch (error: any) {
      setError(error.message || 'Failed to fetch polls')
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePoll = async () => {
    if (!deleteDialog.pollId) return

    try {
      const { error } = await supabase
        .from('polls')
        .delete()
        .eq('id', deleteDialog.pollId)

      if (error) throw error

      setDeleteDialog({ open: false, pollId: '' })
      fetchPolls()
    } catch (error: any) {
      setError(error.message || 'Failed to delete poll')
    }
  }

  const togglePollStatus = async (pollId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('polls')
        .update({ is_active: !currentStatus })
        .eq('id', pollId)

      if (error) throw error

      fetchPolls()
    } catch (error: any) {
      setError(error.message || 'Failed to update poll status')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold">Your Polls</h2>
            <p className="text-gray-600 mt-1">Manage and monitor all polls</p>
          </div>
          <Button onClick={() => router.push('/admin/create-poll')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Poll
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {polls.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-600 mb-4">No polls created yet</p>
              <Button onClick={() => router.push('/admin/create-poll')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Poll
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {polls.map((poll) => (
              <Card key={poll.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{poll.title}</CardTitle>
                    <div className="flex gap-2">
                      <Badge variant={poll.poll_type === 'single' ? 'default' : 'secondary'}>
                        {poll.poll_type === 'single' ? 'Single' : 'Multiple'}
                      </Badge>
                      <Badge variant={poll.is_active ? 'default' : 'secondary'}>
                        {poll.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  {poll.description && (
                    <CardDescription className="line-clamp-2">{poll.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {poll.file_url && (
                    <div>
                      {poll.file_type === 'image' ? (
                        <img
                          src={poll.file_url}
                          alt="Poll attachment"
                          className="w-full h-32 object-cover rounded-md"
                        />
                      ) : (
                        <a
                          href={poll.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          View attached file
                        </a>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{poll.vote_count} votes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BarChart3 className="h-4 w-4" />
                      <span>{new Date(poll.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => router.push(`/polls/${poll.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => togglePollStatus(poll.id, poll.is_active)}
                    >
                      {poll.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Dialog
                      open={deleteDialog.open && deleteDialog.pollId === poll.id}
                      onOpenChange={(open) => setDeleteDialog({ open, pollId: poll.id })}
                    >
                      <DialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete Poll</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to delete this poll? This action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setDeleteDialog({ open: false, pollId: '' })}
                          >
                            Cancel
                          </Button>
                          <Button variant="destructive" onClick={handleDeletePoll}>
                            Delete
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
