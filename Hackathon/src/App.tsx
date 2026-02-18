import React, { useState } from 'react'
import {
    Container,
    Box,
    Typography,
    TextField,
    Button,
    Card,
    CardContent,
    IconButton,
    Chip,
    Stack,
    Divider,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    useTheme,
    Paper,
    Fade
} from '@mui/material'
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    CheckCircle as CheckCircleIcon,
    RadioButtonUnchecked as UncheckedIcon,
    Edit as EditIcon,
    AccountBalanceWallet as WalletIcon,
    Assignment as TaskIcon,
    Category as CategoryIcon,
    PriorityHigh as PriorityIcon
} from '@mui/icons-material'
import { useAccount, useConnect, useDisconnect, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { ABI, CONTRACT_ADDRESS } from './contract'

interface Task {
    id: bigint
    content: string
    isCompleted: boolean
    createdAt: bigint
    updatedAt: bigint
    priority: number
    category: string
}

const App: React.FC = () => {
    const theme = useTheme()
    const { address, isConnected } = useAccount()
    const { connect } = useConnect()
    const { disconnect } = useDisconnect()

    // State for adding task
    const [content, setContent] = useState('')
    const [priority, setPriority] = useState(1)
    const [category, setCategory] = useState('General')

    // State for updating task
    const [editingTask, setEditingTask] = useState<Task | null>(null)
    const [editContent, setEditContent] = useState('')

    // Contract Read: Get all tasks
    const { data: tasks, isLoading: isTasksLoading, refetch } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: 'getAllTasks',
        account: address,
    })

    // Contract Write: Create Task
    const { writeContract: createTask, data: createHash, isPending: isCreatePending } = useWriteContract()
    const { isLoading: isCreateConfirming, isSuccess: isCreateSuccess } = useWaitForTransactionReceipt({ hash: createHash })

    // Contract Write: Toggle Task
    const { writeContract: toggleTask, data: toggleHash, isPending: isTogglePending } = useWriteContract()
    const { isLoading: isToggleConfirming, isSuccess: isToggleSuccess } = useWaitForTransactionReceipt({ hash: toggleHash })

    // Contract Write: Delete Task
    const { writeContract: deleteTask, data: deleteHash, isPending: isDeletePending } = useWriteContract()
    const { isLoading: isDeleteConfirming, isSuccess: isDeleteSuccess } = useWaitForTransactionReceipt({ hash: deleteHash })

    // Contract Write: Update Task
    const { writeContract: updateTask, data: updateHash, isPending: isUpdatePending } = useWriteContract()
    const { isLoading: isUpdateConfirming, isSuccess: isUpdateSuccess } = useWaitForTransactionReceipt({ hash: updateHash })

    const handleCreateTask = () => {
        if (!content) return
        createTask({
            address: CONTRACT_ADDRESS,
            abi: ABI,
            functionName: 'createTaskWithDetails',
            args: [content, priority, category],
        })
    }

    const handleToggle = (id: bigint) => {
        toggleTask({
            address: CONTRACT_ADDRESS,
            abi: ABI,
            functionName: 'toggleTask',
            args: [id],
        })
    }

    const handleDelete = (id: bigint) => {
        deleteTask({
            address: CONTRACT_ADDRESS,
            abi: ABI,
            functionName: 'deleteTask',
            args: [id],
        })
    }

    const handleUpdate = () => {
        if (!editingTask || !editContent) return
        updateTask({
            address: CONTRACT_ADDRESS,
            abi: ABI,
            functionName: 'updateTask',
            args: [editingTask.id, editContent],
        })
        setEditingTask(null)
    }

    // Refetch after transactions
    React.useEffect(() => {
        if (isCreateSuccess || isToggleSuccess || isDeleteSuccess || isUpdateSuccess) {
            refetch()
            if (isCreateSuccess) setContent('')
        }
    }, [isCreateSuccess, isToggleSuccess, isDeleteSuccess, isUpdateSuccess, refetch])

    const getPriorityColor = (p: number) => {
        switch (p) {
            case 3: return 'error'
            case 2: return 'warning'
            default: return 'info'
        }
    }

    return (
        <Container maxWidth="md" sx={{ py: { xs: 3, md: 6 }, px: { xs: 2, sm: 3 } }}>
            {/* Header */}
            <Box
                display="flex"
                flexDirection={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                gap={2}
                mb={{ xs: 4, md: 6 }}
            >
                <Box display="flex" alignItems="center" gap={2}>
                    <TaskIcon color="primary" sx={{ fontSize: { xs: 32, md: 40 } }} />
                    <Typography variant="h4" color="primary" sx={{ fontSize: { xs: '1.75rem', md: '2.125rem' } }}>
                        D-Todo
                    </Typography>
                </Box>
                {isConnected ? (
                    <Button
                        variant="outlined"
                        color="secondary"
                        fullWidth={false}
                        onClick={() => disconnect()}
                        startIcon={<WalletIcon />}
                        sx={{ width: { xs: '100%', sm: 'auto' } }}
                    >
                        {address?.slice(0, 6)}...{address?.slice(-4)}
                    </Button>
                ) : (
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={() => connect({ connector: injected() })}
                        startIcon={<WalletIcon />}
                        sx={{ width: { xs: '100%', sm: 'auto' } }}
                    >
                        Connect Wallet
                    </Button>
                )}
            </Box>

            {/* Add Task Section */}
            {isConnected && (
                <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, mb: { xs: 4, md: 6 }, backgroundColor: 'rgba(30, 41, 59, 0.5)', backdropFilter: 'blur(10px)', borderRadius: 4 }}>
                    <Typography variant="h6" mb={3} display="flex" alignItems="center" gap={1}>
                        <AddIcon fontSize="small" /> New Task
                    </Typography>
                    <Stack spacing={3}>
                        <TextField
                            fullWidth
                            label="What needs to be done?"
                            variant="outlined"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            disabled={isCreatePending || isCreateConfirming}
                        />
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                            <FormControl fullWidth>
                                <InputLabel>Priority</InputLabel>
                                <Select
                                    value={priority}
                                    label="Priority"
                                    onChange={(e) => setPriority(Number(e.target.value))}
                                >
                                    <MenuItem value={1}>Low</MenuItem>
                                    <MenuItem value={2}>Medium</MenuItem>
                                    <MenuItem value={3}>High</MenuItem>
                                </Select>
                            </FormControl>
                            <TextField
                                fullWidth
                                label="Category"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                            />
                            <Button
                                variant="contained"
                                size="large"
                                disabled={!content || isCreatePending || isCreateConfirming}
                                onClick={handleCreateTask}
                                sx={{ minWidth: { xs: '100%', md: 150 }, py: 1.5 }}
                            >
                                {isCreatePending || isCreateConfirming ? <CircularProgress size={24} color="inherit" /> : 'Create'}
                            </Button>
                        </Stack>
                    </Stack>
                </Paper>
            )}

            {/* Task List Section */}
            {!isConnected ? (
                <Box textAlign="center" py={10}>
                    <WalletIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2, opacity: 0.3 }} />
                    <Typography variant="h6" color="text.secondary">
                        Please connect your wallet to see your tasks
                    </Typography>
                </Box>
            ) : (isTasksLoading && !tasks) ? (
                <Box textAlign="center" py={10}>
                    <CircularProgress />
                    <Typography mt={2} color="text.secondary">Fetching tasks...</Typography>
                </Box>
            ) : (
                <Stack spacing={2}>
                    {tasks && (tasks as Task[]).length > 0 ? (
                        (tasks as Task[]).map((task) => (
                            <Fade in key={task.id.toString()}>
                                <Card
                                    sx={{
                                        opacity: task.isCompleted ? 0.7 : 1,
                                        transition: '0.3s',
                                        '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 16px 0 rgba(0,0,0,0.4)' }
                                    }}
                                >
                                    <CardContent sx={{ py: '16px !important', px: { xs: 2, sm: 3 } }}>
                                        <Box display="flex" alignItems="flex-start" gap={{ xs: 1, sm: 2 }}>
                                            <IconButton
                                                color={task.isCompleted ? 'secondary' : 'default'}
                                                onClick={() => handleToggle(task.id)}
                                                sx={{ mt: -0.5 }}
                                            >
                                                {task.isCompleted ? <CheckCircleIcon /> : <UncheckedIcon />}
                                            </IconButton>

                                            <Box flex={1}>
                                                <Typography
                                                    variant="body1"
                                                    sx={{
                                                        textDecoration: task.isCompleted ? 'line-through' : 'none',
                                                        color: task.isCompleted ? 'text.secondary' : 'text.primary',
                                                        fontWeight: 500,
                                                        wordBreak: 'break-word'
                                                    }}
                                                >
                                                    {task.content}
                                                </Typography>
                                                <Stack direction="row" spacing={1} mt={1} flexWrap="wrap" useFlexGap gap={1}>
                                                    <Chip
                                                        size="small"
                                                        label={task.category}
                                                        icon={<CategoryIcon sx={{ fontSize: '14px !important' }} />}
                                                        variant="outlined"
                                                    />
                                                    <Chip
                                                        size="small"
                                                        label={['Low', 'Medium', 'High'][task.priority - 1]}
                                                        color={getPriorityColor(task.priority)}
                                                        icon={<PriorityIcon sx={{ fontSize: '14px !important' }} />}
                                                    />
                                                </Stack>
                                            </Box>

                                            <Stack direction="row">
                                                <IconButton size="small" onClick={() => { setEditingTask(task); setEditContent(task.content); }}>
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton size="small" color="error" onClick={() => handleDelete(task.id)}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Stack>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Fade>
                        ))
                    ) : (
                        <Box textAlign="center" py={10} sx={{ border: '2px dashed rgba(255,255,255,0.05)', borderRadius: 4 }}>
                            <Typography color="text.secondary">No tasks yet. Start by adding one above!</Typography>
                        </Box>
                    )}
                </Stack>
            )}

            {/* Edit Dialog */}
            <Dialog open={!!editingTask} onClose={() => setEditingTask(null)} fullWidth maxWidth="xs">
                <DialogTitle>Update Task</DialogTitle>
                <DialogContent>
                    <Box pt={1}>
                        <TextField
                            fullWidth
                            label="Task Content"
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditingTask(null)}>Cancel</Button>
                    <Button variant="contained" onClick={handleUpdate}>Update</Button>
                </DialogActions>
            </Dialog>
        </Container>
    )
}

export default App
