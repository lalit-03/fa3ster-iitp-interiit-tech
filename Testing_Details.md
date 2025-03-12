# Testing Details

During our tests, we focused on financial documents, specifically 10-Q and 10-K reports.

While running the VectorStoreServer, we noticed that the server setup time varies based on document volume.

### Datasets Tested

1. **AAPL 10Q Dataset**: This dataset, located in the directory with the same name, consists of 4 10Q documents totaling 131 pages. The server setup time for this dataset was approximately 45 minutes.

2. **FinQABench Dataset**: Available on [Huggingface](https://huggingface.co/datasets/lighthouzai/finqabench), this dataset includes Apple's 10-K 2022 report, which is 80 pages long. The server setup time for this dataset was approximately 30 minutes.

The results of our model on these datasets are provided in the "Results and Metrics" section of our report.

- **Alphabet's 10-K 2023 Report**: This additional document, used for some of our initial experiments(demonstrated in the videos submitted during mid-term), is 100 pages long and required around 40 minutes to set up the server.