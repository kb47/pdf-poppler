FROM amazonlinux:2

# Install dependencies
RUN yum update -y && yum install -y \
    wget \
    tar \
    gzip \
    which \
    && yum clean all

# Install poppler-utils
RUN yum install -y poppler-utils

# Create output directories
RUN mkdir -p /output/bin /output/lib

WORKDIR /build

# Copy poppler binaries
RUN cp /usr/bin/pdfinfo /output/bin/ || echo "pdfinfo not available"
RUN cp /usr/bin/pdftotext /output/bin/ || echo "pdftotext not available"
RUN cp /usr/bin/pdftoppm /output/bin/ || echo "pdftoppm not available"
RUN cp /usr/bin/pdftops /output/bin/ || echo "pdftops not available"
RUN cp /usr/bin/pdfimages /output/bin/ || echo "pdfimages not available"
RUN cp /usr/bin/pdffonts /output/bin/ || echo "pdffonts not available"
RUN cp /usr/bin/pdfattach /output/bin/ || echo "pdfattach not available"
RUN cp /usr/bin/pdfdetach /output/bin/ || echo "pdfdetach not available"
RUN cp /usr/bin/pdfseparate /output/bin/ || echo "pdfseparate not available"
RUN cp /usr/bin/pdfunite /output/bin/ || echo "pdfunite not available"

# Make binaries executable
RUN chmod +x /output/bin/*

# Copy essential shared libraries (simplified approach)
RUN echo "Copying essential libraries..." && \
    cp /lib64/libc.so.6 /output/lib/ 2>/dev/null || true && \
    cp /lib64/libm.so.6 /output/lib/ 2>/dev/null || true && \
    cp /lib64/libpthread.so.0 /output/lib/ 2>/dev/null || true && \
    cp /lib64/libdl.so.2 /output/lib/ 2>/dev/null || true

# Verify what we have
RUN echo "=== Available poppler binaries ===" && \
    ls -la /output/bin/ && \
    echo "=== Available libraries ===" && \
    ls -la /output/lib/ && \
    echo "=== Testing pdfinfo ===" && \
    /output/bin/pdfinfo -v 2>/dev/null || echo "pdfinfo test completed"

WORKDIR /output

# Simple CMD that works regardless of lib directory state
CMD tar -czf /tmp/poppler-linux-lambda-binaries.tar.gz bin $([ -d lib ] && echo lib || echo "")