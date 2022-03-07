package com.weisong.backend.service.impl;

import com.weisong.backend.entities.Comment;
import com.weisong.backend.mapper.CommentMapper;
import com.weisong.backend.service.CommentService;
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
}
