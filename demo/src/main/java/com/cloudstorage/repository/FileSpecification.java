package com.cloudstorage.repository;

import com.cloudstorage.model.File;
import com.cloudstorage.model.User;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;

public class FileSpecification {

    public static Specification<File> hasUser(User user) {
        return (root, query, cb) -> cb.equal(root.get("user"), user);
    }

    public static Specification<File> isNotTrashed() {
        return (root, query, cb) -> cb.equal(root.get("isTrashed"), false);
    }

    public static Specification<File> hasFileType(String fileType) {
        return (root, query, cb) -> {
            if (fileType == null || fileType.isEmpty())
                return null;
            return cb.like(cb.lower(root.get("fileType")), "%" + fileType.toLowerCase() + "%");
        };
    }

    public static Specification<File> hasSizeGreaterThan(Long minSize) {
        return (root, query, cb) -> {
            if (minSize == null)
                return null;
            return cb.greaterThanOrEqualTo(root.get("fileSize"), minSize);
        };
    }

    public static Specification<File> hasSizeLessThan(Long maxSize) {
        return (root, query, cb) -> {
            if (maxSize == null)
                return null;
            return cb.lessThanOrEqualTo(root.get("fileSize"), maxSize);
        };
    }

    public static Specification<File> createdAfter(LocalDateTime date) {
        return (root, query, cb) -> {
            if (date == null)
                return null;
            return cb.greaterThanOrEqualTo(root.get("createdAt"), date);
        };
    }

    public static Specification<File> createdBefore(LocalDateTime date) {
        return (root, query, cb) -> {
            if (date == null)
                return null;
            return cb.lessThanOrEqualTo(root.get("createdAt"), date);
        };
    }

    public static Specification<File> nameContains(String name) {
        return (root, query, cb) -> {
            if (name == null || name.isEmpty())
                return null;
            return cb.like(cb.lower(root.get("fileName")), "%" + name.toLowerCase() + "%");
        };
    }
}
