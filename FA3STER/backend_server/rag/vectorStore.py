from typing import Callable
import json
import logging
import threading
from collections.abc import Callable, Coroutine
from typing import TYPE_CHECKING, cast
import jmespath
import requests
import pathway as pw
import pathway.xpacks.llm.parsers
from pathway.xpacks.llm.vector_store import VectorStoreServer

if TYPE_CHECKING:
    import langchain_core.documents
    import langchain_core.embeddings

class CustomVectorStoreServer(VectorStoreServer):
    @classmethod
    def from_langchain_components(
        cls,
        *docs,
        embedder: "langchain_core.embeddings.Embeddings",
        parser: Callable[[bytes], list[tuple[str, dict]]] | None = None,
        splitter: "langchain_core.documents.BaseDocumentTransformer | None" = None,
        **kwargs,
    ):
        """
        Initializes CustomVectorStoreServer by using LangChain components with synchronous embedder.
        """
        try:
            from langchain_core.documents import Document
        except ImportError:
            raise ImportError(
                "Please install langchain_core: `pip install langchain_core`"
            )

        generic_splitter = None
        if splitter:
            generic_splitter = lambda x: [
                (doc.page_content, doc.metadata)
                for doc in splitter.transform_documents([Document(page_content=x)])
            ]

        # Use synchronous embedding instead of asynchronous
        async def generic_embedded(x: str) -> list[float]:
            res = await embedder.aembed_documents([x])
            print('-----res----: ')
            return res[0]

        return cls(
            *docs,
            embedder=generic_embedded,
            parser=parser,
            splitter=generic_splitter,
            **kwargs,
        )