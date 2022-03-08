package com.weisong.backend.service.impl;

import com.weisong.backend.entities.Comment;
import com.weisong.backend.mapper.CommentMapper;
import com.weisong.backend.service.CommentService;
import com.weisong.backend.util.BaseUserInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * @author 李伟松
 * @create 2022-02-26-11:41
 */
@Service
public class CommentServiceImpl implements CommentService {

    @Autowired
    CommentMapper commentMapper;

    @Override
    public List<Comment> getCommentByArticleUuid(String articleUuid) {
        return commentMapper.getCommentByArticleUuid(articleUuid);
    }

    @Override
    public void writeComment(Comment comment) {
        commentMapper.writeComment(
                BaseUserInfo.get("userUuid"),
                comment.getArticleUuid(),
                comment.getComment(),
                comment.getCommentTime());
    }
}
