package com.weisong.backend.controller;


import com.weisong.backend.Token.UserLoginToken;
import com.weisong.backend.entities.Comment;
import com.weisong.backend.service.CommentService;
import com.weisong.backend.util.Result.BlogJSONResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Map;


@RestController
@RequestMapping(value = "/comment")
public class CommentController {

    @Autowired
    CommentService commentService;

    @GetMapping(value = "/{articleUuid}")
    public BlogJSONResult getCommentByArticleUuid(@PathVariable("articleUuid")String articleUuid){
        return BlogJSONResult.ok(commentService.getCommentByArticleUuid(articleUuid));
    }

    @UserLoginToken
    @PostMapping(value = "/addComment")
    public BlogJSONResult writeComment(@RequestBody Comment comment){
        SimpleDateFormat a=new SimpleDateFormat("yyyy-MM-dd HH:mm");
        comment.setCommentTime(a.format(new Date()));
        commentService.writeComment(comment);
        return BlogJSONResult.ok();
    }
}
