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
  Button
} from "@mui/material";
import { styled } from "@mui/system";

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
      transferType
    }
  }
`;

// Styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
  marginBottom: theme.spacing(4),
}));

const LoadingContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '200px',
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
  <StyledPaper>
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>From</TableCell>
            <TableCell>To</TableCell>
            <TableCell align="right">Value</TableCell>
            <TableCell>Transfer Type</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((event) => (
            <TableRow key={event.id}>
              <TableCell>{event.from}</TableCell>
              <TableCell>{event.to}</TableCell>
              <TableCell align="right">{event.value}</TableCell>
              <TableCell>{event.transferType}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </StyledPaper>
);

// Create a component to fetch and display data
const TransferEvents: React.FC = () => {
  const [tabValue, setTabValue] = React.useState(0);
  const [accountAddress, setAccountAddress] = useState("");
  const [minValue, setMinValue] = useState("");

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

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
    if (loading) return <LoadingContainer><CircularProgress /></LoadingContainer>;
    if (error) return <Alert severity="error">Error: {error.message}</Alert>;
    if (!data || data.transferEvents.length === 0) return <Alert severity="info">No data available</Alert>;
    return <TransferEventsTable data={data.transferEvents} />;
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h2" component="h1" gutterBottom>
        TokenTrackr
      </Typography>

      <StyledPaper>
        <Tabs value={tabValue} onChange={handleTabChange} centered>
          <Tab label="Sorted" />
          <Tab label="Filtered" />
          <Tab label="Paginated" />
          <Tab label="Logical" />
        </Tabs>
      </StyledPaper>

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
          <Box sx={{ mb: 2 }}>
            <TextField
              label="Account Address"
              value={accountAddress}
              onChange={(e) => setAccountAddress(e.target.value)}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Minimum Value"
              value={minValue}
              onChange={(e) => setMinValue(e.target.value)}
              fullWidth
              margin="normal"
            />
            <Button variant="contained" onClick={handleLogicalSearch} sx={{ mt: 1 }}>
              Search
            </Button>
          </Box>
          {renderContent(loadingLogical, errorLogical, dataLogical)}
        </>
      )}
    </Container>
  );
};

export default TransferEvents;