export type ProjectStatus = 'draft' | 'active' | 'review' | 'completed' | 'archived'
export type Priority = 'low' | 'medium' | 'high' | 'critical'
export type SceneStatus = 'not_started' | 'in_progress' | 'review' | 'revision' | 'completed' | 'approved'
export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type ShareMode = 'private' | 'view' | 'comment' | 'edit' | 'admin'
export type MemberRole = 'admin' | 'team_lead' | 'employee' | 'viewer'

export interface Project {
  id: string
  title: string
  description: string | null
  slug: string
  category: string
  status: ProjectStatus
  priority: Priority
  thumbnail_url: string | null
  script_url: string | null
  script_raw_text: string | null
  ai_generated_structure: AIGeneratedStructure | null
  is_published: boolean
  share_token: string
  share_mode: ShareMode
  deadline: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // Computed
  topics?: Topic[]
  members?: ProjectMember[]
  total_scenes?: number
  completed_scenes?: number
  progress?: number
}

export interface AIGeneratedStructure {
  project_title: string
  description: string
  topics: AITopic[]
  characters: string[]
  estimated_total_duration: string
  production_notes: string
}

export interface AITopic {
  title: string
  description: string
  scenes: AIScene[]
}

export interface AIScene {
  title: string
  description: string
  script_text: string
  characters: string[]
  estimated_duration_seconds: number
  complexity: 'low' | 'medium' | 'high'
  suggested_tasks: string[]
}

export interface Topic {
  id: string
  project_id: string
  title: string
  description: string | null
  color: string
  sort_order: number
  is_archived: boolean
  created_at: string
  updated_at: string
  scenes?: Scene[]
}

export interface Scene {
  id: string
  topic_id: string
  project_id: string
  title: string
  description: string | null
  script_text: string | null
  status: SceneStatus
  progress: number
  priority: Priority
  deadline: string | null
  sort_order: number
  color: string | null
  tags: string[]
  is_archived: boolean
  created_at: string
  updated_at: string
  tasks?: Task[]
  assignments?: SceneAssignment[]
  comments?: Comment[]
}

export interface Task {
  id: string
  scene_id: string
  project_id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: Priority
  deadline: string | null
  sort_order: number
  is_archived: boolean
  created_at: string
  updated_at: string
  checklist_items?: ChecklistItem[]
}

export interface ChecklistItem {
  id: string
  task_id: string
  text: string
  is_checked: boolean
  sort_order: number
  created_at: string
}

export interface ProjectMember {
  id: string
  project_id: string
  clerk_id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  role: MemberRole
  joined_at: string
}

export interface SceneAssignment {
  id: string
  scene_id: string
  clerk_id: string
  full_name: string | null
  avatar_url: string | null
  assigned_by: string | null
  assigned_at: string
}

export interface Comment {
  id: string
  project_id: string
  scene_id: string | null
  task_id: string | null
  parent_id: string | null
  author_clerk_id: string
  author_name: string | null
  author_avatar: string | null
  content: string
  is_resolved: boolean
  created_at: string
  updated_at: string
}

export interface Note {
  id: string
  project_id: string
  scene_id: string | null
  author_clerk_id: string | null
  author_name: string | null
  content: string
  created_at: string
  updated_at: string
}

export interface ActivityLog {
  id: string
  project_id: string
  clerk_id: string | null
  user_name: string | null
  user_avatar: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  entity_title: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface Notification {
  id: string
  clerk_id: string
  project_id: string | null
  type: string
  title: string
  message: string | null
  is_read: boolean
  action_url: string | null
  created_at: string
}

export interface Attachment {
  id: string
  project_id: string
  scene_id: string | null
  task_id: string | null
  uploaded_by: string | null
  file_name: string
  file_url: string
  file_size: number | null
  file_type: string | null
  created_at: string
}

export interface SceneApproval {
  id: string
  scene_id: string
  reviewer_clerk_id: string | null
  reviewer_name: string | null
  status: 'pending' | 'approved' | 'rejected' | 'revision_requested'
  feedback: string | null
  created_at: string
}

export interface PresenceUser {
  clerk_id: string
  full_name: string
  avatar_url?: string
  editing_entity?: string
  online_at: string
}
