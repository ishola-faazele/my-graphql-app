import React, { useState } from "react";
import { useQuery, gql } from "@apollo/client";
import { 
  Container, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  CircularProgress,
  Box,
  Tabs,
  Tab,
  Alert,
  TextField,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Grid
} from "@mui/material";
import { styled } from "@mui/system";
import SearchIcon from '@mui/icons-material/Search';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

// Define queries
const GET_TRANSFER_EVENTS_SORTED = gql`
  query GetTransferEventsSorted {
    transferEvents(orderBy: value, orderDirection: desc) {
      id
      from
      to
      value
    }
  }
`;

const GET_TRANSFER_EVENTS_FILTERED = gql`
  query GetTransferEventsFiltered {
    transferEvents(where: { value_gt: "1000" }) {
      id
      from
      to
      value
    }
  }
`;

const GET_TRANSFER_EVENTS_PAGINATED = gql`
  query GetTransferEventsPaginated($skip: Int!, $first: Int!) {
    transferEvents(first: $first, skip: $skip) {
      id
      from
      to
      value
    }
  }
`;

const GET_TRANSFER_EVENTS_LOGICAL = gql`
  query GetTransferEventsLogical($from: Bytes!, $value: BigInt!) {
    transferEvents(
      where: {
        and: [
          { value_gt: $value },
          { from: $from }
        ]
      }
    ) {
      id
      from
      to
      value
    }
  }
`;

// Styled components
const StyledContainer = styled(Container)(({ theme }) => ({
  marginTop: theme.spacing(4),
  marginBottom: theme.spacing(4),
}));

const StyledCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
}));

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  maxHeight: '400px',
  overflowY: 'auto',
}));

const StyledTableHead = styled(TableHead)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  '& th': {
    color: theme.palette.common.white,
    fontWeight: 'bold',
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const LoadingContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '400px',
}));

// Define TypeScript interfaces
interface TransferEvent {
  id: string;
  from: string;
  to: string;
  value: string;
  transferType?: string;
}

interface QueryResult {
  transferEvents: TransferEvent[];
}

// Create a reusable table component
const TransferEventsTable: React.FC<{ data: TransferEvent[] }> = ({ data }) => (
  <StyledCard>
    <StyledTableContainer>
      <Table stickyHeader>
        <StyledTableHead>
          <TableRow>
            <TableCell>From</TableCell>
            <TableCell>To</TableCell>
            <TableCell align="right">Value</TableCell>
          </TableRow>
        </StyledTableHead>
        <TableBody>
          {data.map((event) => (
            <StyledTableRow key={event.id}>
              <TableCell>{event.from}</TableCell>
              <TableCell>{event.to}</TableCell>
              <TableCell align="right">{event.value}</TableCell>
              {event.transferType && (
                <TableCell>{event.transferType}</TableCell>
              )}
            </StyledTableRow>
          ))}
        </TableBody>
      </Table>
    </StyledTableContainer>
  </StyledCard>
);

// Create a component to fetch and display data
const TransferEvents: React.FC = () => {
  const [tabValue, setTabValue] = React.useState(0);
  const [accountAddress, setAccountAddress] = useState("");
  const [minValue, setMinValue] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { loading: loadingSorted, error: errorSorted, data: dataSorted } = useQuery<QueryResult>(GET_TRANSFER_EVENTS_SORTED);
  const { loading: loadingFiltered, error: errorFiltered, data: dataFiltered } = useQuery<QueryResult>(GET_TRANSFER_EVENTS_FILTERED);
  const { loading: loadingPaginated, error: errorPaginated, data: dataPaginated } = useQuery<QueryResult>(GET_TRANSFER_EVENTS_PAGINATED, {
    variables: { skip: 0, first: 10 }
  });
  const { loading: loadingLogical, error: errorLogical, data: dataLogical, refetch: refetchLogical } = useQuery<QueryResult>(GET_TRANSFER_EVENTS_LOGICAL, {
    variables: { from: accountAddress, value: minValue },
    skip: !accountAddress || !minValue // Skip this query until we have both inputs
  });

  const handleLogicalSearch = () => {
    if (accountAddress && minValue) {
      refetchLogical({ from: accountAddress, value: minValue });
    }
  };

  const renderContent = (loading: boolean, error: any, data: QueryResult | undefined) => {
    if (loading) return <LoadingContainer><CircularProgress size={60} /></LoadingContainer>;
    if (error) return <Alert severity="error" variant="filled">Error: {error.message}</Alert>;
    if (!data || data.transferEvents.length === 0) return <Alert severity="info" variant="filled">No data available</Alert>;
    return <TransferEventsTable data={data.transferEvents} />;
  };

  return (
    <>
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            TokenTrackr
          </Typography>
          <IconButton color="inherit" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Toolbar>
      </AppBar>
      <StyledContainer maxWidth="lg">
        <StyledCard>
          <CardContent>
            <Tabs 
              value={tabValue} 
              onChange={(_, newValue) => setTabValue(newValue)} 
              centered={!isMobile}
              variant={isMobile ? "scrollable" : "standard"}
              scrollButtons="auto"
            >
              <Tab label="Sorted" />
              <Tab label="Filtered" />
              <Tab label="Paginated" />
              <Tab label="Logical" />
            </Tabs>
          </CardContent>
        </StyledCard>

        {tabValue === 0 && (
          <>
            <Typography variant="h4" component="h2" gutterBottom>
              Sorted by Value
            </Typography>
            {renderContent(loadingSorted, errorSorted, dataSorted)}
          </>
        )}

        {tabValue === 1 && (
          <>
            <Typography variant="h4" component="h2" gutterBottom>
              Filtered by Value {">"} 1000
            </Typography>
            {renderContent(loadingFiltered, errorFiltered, dataFiltered)}
          </>
        )}

        {tabValue === 2 && (
          <>
            <Typography variant="h4" component="h2" gutterBottom>
              Paginated
            </Typography>
            {renderContent(loadingPaginated, errorPaginated, dataPaginated)}
          </>
        )}

        {tabValue === 3 && (
          <>
            <Typography variant="h4" component="h2" gutterBottom>
              Logical Operators
            </Typography>
            <StyledCard>
              <CardContent>
                <Grid container spacing={2} alignItems="flex-end">
                  <Grid item xs={12} sm={5}>
                    <TextField
                      label="Account Address"
                      value={accountAddress}
                      onChange={(e) => setAccountAddress(e.target.value)}
                      fullWidth
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={5}>
                    <TextField
                      label="Minimum Value"
                      value={minValue}
                      onChange={(e) => setMinValue(e.target.value)}
                      fullWidth
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <Button 
                      variant="contained" 
                      onClick={handleLogicalSearch} 
                      fullWidth
                      startIcon={<SearchIcon />}
                    >
                      Search
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </StyledCard>
            {renderContent(loadingLogical, errorLogical, dataLogical)}
          </>
        )}
      </StyledContainer>
    </>
  );
};

export default TransferEvents;
