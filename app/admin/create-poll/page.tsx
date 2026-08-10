'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Trash2, Upload } from 'lucide-react'

interface PollOption {
  id: string
  text: string
}

export default function CreatePollPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [pollType, setPollType] = useState<'single' | 'multiple'>('single')
  const [options, setOptions] = useState<PollOption[]>([
    { id: '1', text: '' },
    { id: '2', text: '' },
  ])
  const [file, setFile] = useState<File | null>(null)
  const [fileType, setFileType] = useState<'image' | 'text' | ''>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (authLoading) return // Wait for auth to complete
    
    if (!user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  const addOption = () => {
    setOptions([...options, { id: Date.now().toString(), text: '' }])
  }

  const removeOption = (id: string) => {
    if (options.length > 2) {
      setOptions(options.filter((opt) => opt.id !== id))
    }
  }

  const updateOption = (id: string, text: string) => {
    setOptions(options.map((opt) => (opt.id === id ? { ...opt, text } : opt)))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      if (selectedFile.type.startsWith('image/')) {
        setFileType('image')
      } else if (selectedFile.type === 'text/plain' || selectedFile.type === 'application/pdf') {
        setFileType('text')
      } else {
        setError('Unsupported file type. Please upload an image or text file.')
        setFile(null)
        setFileType('')
      }
    }
  }

  const uploadFile = async (): Promise<string | null> => {
    if (!file) return null

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `poll-files/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('poll-files')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('poll-files')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error: any) {
      console.error('File upload error:', error)
      throw new Error('Failed to upload file')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validation
    if (!title.trim()) {
      setError('Title is required')
      setLoading(false)
      return
    }

    const validOptions = options.filter((opt) => opt.text.trim())
    if (validOptions.length < 2) {
      setError('At least 2 options are required')
      setLoading(false)
      return
    }

    try {
      // Check if user is admin
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id)
        .single()

      if (roleError || roleData?.role !== 'admin') {
        setError('Only admins can create polls')
        setLoading(false)
        return
      }

      // Upload file if present
      let fileUrl: string | null = null
      if (file) {
        fileUrl = await uploadFile()
      }

      // Create poll
      const { data: pollData, error: pollError } = await supabase
        .from('polls')
        .insert({
          title,
          description,
          poll_type: pollType,
          file_url: fileUrl,
          file_type: fileType || null,
          created_by: user?.id,
        })
        .select()
        .single()

      if (pollError) throw pollError

      // Create poll options
      const optionsToInsert = validOptions.map((opt, index) => ({
        poll_id: pollData.id,
        option_text: opt.text,
        option_order: index + 1,
      }))

      const { error: optionsError } = await supabase
        .from('poll_options')
        .insert(optionsToInsert)

      if (optionsError) throw optionsError

      router.push('/admin/polls')
      router.refresh()
    } catch (error: any) {
      setError(error.message || 'Failed to create poll')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Create New Poll</CardTitle>
            <CardDescription>Create a poll for users to vote on</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Poll Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter poll title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter poll description (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pollType">Poll Type</Label>
                <Select value={pollType} onValueChange={(value: 'single' | 'multiple') => setPollType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single Choice</SelectItem>
                    <SelectItem value="multiple">Multiple Choice</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Options *</Label>
                <div className="space-y-3">
                  {options.map((option) => (
                    <div key={option.id} className="flex gap-2">
                      <Input
                        placeholder={`Option ${options.indexOf(option) + 1}`}
                        value={option.text}
                        onChange={(e) => updateOption(option.id, e.target.value)}
                        className="flex-1"
                      />
                      {options.length > 2 && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => removeOption(option.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addOption}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Option
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">Attach File (Optional)</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="file"
                    type="file"
                    accept="image/*,.txt,.pdf"
                    onChange={handleFileChange}
                    className="flex-1"
                  />
                  {file && (
                    <div className="text-sm text-gray-600">
                      {file.name} ({(file.size / 1024).toFixed(2)} KB)
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Supported formats: Images (JPG, PNG, GIF), Text files (TXT, PDF)
                </p>
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Creating Poll...' : 'Create Poll'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
